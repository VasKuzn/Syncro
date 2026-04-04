/**
 * Биоинспирированный алгоритм оптимизации выбора TURN-серверов
 * На основе алгоритма пчелиной колонии
 * 
 * Идея: накапливаем статистику успешных и неудачных подключений к каждому TURN-серверу,
 * рассчитываем фитнес каждого сервера и сортируем их при создании RTCPeerConnection.
 * Лучшие серверы  используются в первую очередь.
 */

interface TurnServerStats {
    url: string;
    successCount: number;
    failureCount: number;
    totalLatency: number;
    connectionCount: number;
    lastUsedTime: number;
    rating: number; // Вычисляемый рейтинг (0-100)
    consecutiveFailures: number; // Счетчик неудач подряд
    isBlacklisted: boolean; // Временно в черном списке 
    blacklistUntil: number; // Timestamp когда убрать из черного списка
}

interface TurnServerRankerConfig {
    exploitationRate?: number; // Вероятность выбрать лучший сервер (0.7-0.9)
    explorationRate?: number;  // Вероятность исследовать худший сервер (0.1-0.3)
    decayFactor?: number;      // Множитель для "забывания" старой статистики (0.95-0.99)
    minConnectionsForRanking?: number; // Минимально подключений для учета рейтинга
    maxConsecutiveFailures?: number; // Максимум consecutive failures для blacklist (по умолчанию 2)
    blacklistDurationMs?: number; // Как долго хранить сервер в черном списке (по умолчанию 30 минут)
}

class TurnServerRanker {
    private serverStats: Map<string, TurnServerStats> = new Map();
    private config: Required<TurnServerRankerConfig & { maxConsecutiveFailures: number; blacklistDurationMs: number }>;
    private readonly STORAGE_KEY = 'turn_server_stats';

    constructor(config: TurnServerRankerConfig = {}) {
        this.config = {
            exploitationRate: config.exploitationRate ?? 0.8,
            explorationRate: config.explorationRate ?? 0.2,
            decayFactor: config.decayFactor ?? 0.97,
            minConnectionsForRanking: config.minConnectionsForRanking ?? 2,
            maxConsecutiveFailures: config.maxConsecutiveFailures ?? 2,
            blacklistDurationMs: config.blacklistDurationMs ?? 30 * 60 * 1000, // 30 минут
        };
        this.loadStatsFromStorage();
    }

    /**
     * Инициализируем список TURN-серверов с начальной статистикой
     */
    public initializeServers(iceServers: RTCIceServer[]): void {
        iceServers.forEach(server => {
            const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
            urls.forEach(url => {
                if (!this.serverStats.has(url)) {
                    this.serverStats.set(url, {
                        url,
                        successCount: 0,
                        failureCount: 0,
                        totalLatency: 0,
                        connectionCount: 0,
                        lastUsedTime: 0,
                        rating: 50,
                        consecutiveFailures: 0,
                        isBlacklisted: false,
                        blacklistUntil: 0,
                    });
                }
            });
        });
        this.saveStatsToStorage();
    }

    /**
     * Рейтинг сервера на основе статистики
     * Формула: (success - failure * 2) / connections * 100, с учетом latency
     */
    public calculateRating(stats: TurnServerStats): number {
        if (stats.connectionCount === 0) return 50;

        const successRate = stats.successCount / stats.connectionCount;
        const failureRate = stats.failureCount / stats.connectionCount;
        const performanceScore = (successRate - failureRate * 1.5) * 100;

        // Штраф за высокую задержку
        const avgLatency = stats.totalLatency / Math.max(stats.successCount, 1);
        const latencyPenalty = Math.min(30, avgLatency / 20); // 0-30 штраф

        const rating = Math.max(0, Math.min(100, performanceScore - latencyPenalty));

        // Decay: старая статистика постепенно забывается
        const timeSinceLastUse = Date.now() - stats.lastUsedTime;
        const decayedRating = rating * Math.pow(this.config.decayFactor, timeSinceLastUse / (24 * 60 * 60 * 1000)); // Decay за сутки

        return Math.round(decayedRating);
    }

    /**
     * Записываем успешное подключение через сервер
     */
    public recordSuccess(serverUrl: string, latency: number = 0): void {
        if (!this.serverStats.has(serverUrl)) {
            this.serverStats.set(serverUrl, {
                url: serverUrl,
                successCount: 1,
                failureCount: 0,
                totalLatency: latency,
                connectionCount: 1,
                lastUsedTime: Date.now(),
                rating: 60,
                consecutiveFailures: 0,
                isBlacklisted: false,
                blacklistUntil: 0,
            });
        } else {
            const stats = this.serverStats.get(serverUrl)!;
            stats.successCount++;
            stats.connectionCount++;
            stats.totalLatency += latency;
            stats.lastUsedTime = Date.now();
            stats.consecutiveFailures = 0; // Reset consecutive failures при успехе
            stats.isBlacklisted = false; // Remove from blacklist
            stats.rating = this.calculateRating(stats);
        }
        this.saveStatsToStorage();
    }

    /**
     * Записываем неудачное подключение
     */
    public recordFailure(serverUrl: string): void {
        if (!this.serverStats.has(serverUrl)) {
            this.serverStats.set(serverUrl, {
                url: serverUrl,
                successCount: 0,
                failureCount: 1,
                totalLatency: 0,
                connectionCount: 1,
                lastUsedTime: Date.now(),
                rating: 40,
                consecutiveFailures: 1,
                isBlacklisted: false,
                blacklistUntil: 0,
            });
        } else {
            const stats = this.serverStats.get(serverUrl)!;
            stats.failureCount++;
            stats.connectionCount++;
            stats.lastUsedTime = Date.now();
            stats.consecutiveFailures++;

            // Если сервер failed N раз подряд -> добавить в черный список
            if (stats.consecutiveFailures >= this.config.maxConsecutiveFailures) {
                stats.isBlacklisted = true;
                stats.blacklistUntil = Date.now() + this.config.blacklistDurationMs;
                console.warn(
                    `🐝 Server ${serverUrl} blacklisted for ${this.config.blacklistDurationMs / 1000}s (${stats.consecutiveFailures} consecutive failures)`
                );
            }

            stats.rating = this.calculateRating(stats);
        }
        this.saveStatsToStorage();
    }

    /**
     * Основной алгоритм: сортируем TURN-серверы с учетом:
     * 1. Exploitation (80%) - берем лучшие серверы по рейтингу
     * 2. Exploration (20%) - иногда проверяем худшие серверы из non-blacklisted
     * 3. Blacklisting - исключаем серверы которые failed N раз подряд
     */
    public rankServers(iceServers: RTCIceServer[]): RTCIceServer[] {
        // Update blacklist status (если время истекло, убрать из черного списка)
        const now = Date.now();
        this.serverStats.forEach(stats => {
            if (stats.isBlacklisted && stats.blacklistUntil <= now) {
                stats.isBlacklisted = false;
                stats.blacklistUntil = 0;
                stats.consecutiveFailures = 0; // Reset для перепроверки
                console.log(`🐝 Server ${stats.url} removed from blacklist (checking again)`);
            }
        });

        const ranked = iceServers.map(server => {
            const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
            const isBlacklisted = urls.some(url => this.serverStats.get(url)?.isBlacklisted);
            const avgRating = urls.reduce((sum, url) => {
                const stats = this.serverStats.get(url);
                return sum + (stats ? stats.rating : 50);
            }, 0) / urls.length;

            return { server, avgRating, isBlacklisted };
        });

        // Разделяем на не в blacklist и в blacklist
        const goodServers = ranked.filter(r => !r.isBlacklisted);
        const blacklistedServers = ranked.filter(r => r.isBlacklisted);

        // Сортируем хорошие серверы по рейтингу DESC
        goodServers.sort((a, b) => b.avgRating - a.avgRating);

        // Применяем bee-like стратегию: top 3-4 из хороших серверов будут в приоритете,
        // остальные будут перемешаны с вероятностью exploration
        const topServersCount = Math.ceil(goodServers.length * this.config.exploitationRate);
        const exploredServers = goodServers.slice(topServersCount);

        // Shuffle explored servers
        for (let i = exploredServers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [exploredServers[i], exploredServers[j]] = [exploredServers[j], exploredServers[i]];
        }

        const rankedServers = [
            ...goodServers.slice(0, topServersCount),
            ...exploredServers,
            ...blacklistedServers, // Blacklisted серверы в конец
        ];

        return rankedServers.map(r => r.server);
    }

    /**
     * Получаем текущую статистику всех серверов
     */
    public getStats(): TurnServerStats[] {
        return Array.from(this.serverStats.values());
    }

    /**
     * Проверяем, находится ли сервер в черном списке
     */
    public isServerBlacklisted(serverUrl: string): boolean {
        const stats = this.serverStats.get(serverUrl);
        if (!stats) return false;

        // Если время истекло - убрать из черного списка
        if (stats.isBlacklisted && stats.blacklistUntil <= Date.now()) {
            stats.isBlacklisted = false;
            stats.blacklistUntil = 0;
            stats.consecutiveFailures = 0;
            return false;
        }

        return stats.isBlacklisted;
    }

    /**
     * Получить сколько consecutive failures у сервера
     */
    public getConsecutiveFailures(serverUrl: string): number {
        return this.serverStats.get(serverUrl)?.consecutiveFailures ?? 0;
    }

    /**
     * Получаем детальный отчет о рейтингах
     */
    public getDetailedReport(): Array<TurnServerStats & { successRate: string; blacklistStatus: string }> {
        return Array.from(this.serverStats.values())
            .sort((a, b) => b.rating - a.rating)
            .map(stats => ({
                ...stats,
                successRate: stats.connectionCount > 0
                    ? `${((stats.successCount / stats.connectionCount) * 100).toFixed(1)}%`
                    : 'N/A',
                blacklistStatus: stats.isBlacklisted
                    ? `Blacklisted (${Math.max(0, Math.ceil((stats.blacklistUntil - Date.now()) / 1000))}s remaining)`
                    : 'Active',
            }));
    }

    /**
     * Очищаем статистику
     */
    public clearStats(): void {
        this.serverStats.clear();
        localStorage.removeItem(this.STORAGE_KEY);
    }

    /**
     * Persisten storage - сохраняем статистику в localStorage
     */
    private saveStatsToStorage(): void {
        try {
            const data = Array.from(this.serverStats.values());
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            console.warn('Failed to save TURN server stats to storage:', err);
        }
    }

    private loadStatsFromStorage(): void {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const stats: TurnServerStats[] = JSON.parse(data);
                stats.forEach(stat => {
                    this.serverStats.set(stat.url, stat);
                });
            }
        } catch (err) {
            console.warn('Failed to load TURN server stats from storage:', err);
        }
    }

    /**
     * Логирование для аналитики
     */
    public logBeaconData(serverUrl: string, success: boolean, latency: number): void {
        try {
            const beacon = {
                server: serverUrl,
                result: success ? 'success' : 'failure',
                latency,
                timestamp: new Date().toISOString(),
            };
            // TODO: Отправить на аналитику на backend
            // navigator.sendBeacon('/api/analytics/turn-server', JSON.stringify(beacon));
            console.debug('TURN Beacon:', beacon);
        } catch (err) {
            console.warn('Failed to log beacon data:', err);
        }
    }
}

export default TurnServerRanker;
