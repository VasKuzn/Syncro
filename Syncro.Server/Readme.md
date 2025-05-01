# 👾 `Форма входа и регистрации`👾
[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&duration=2000&pause=1000&color=F76262&width=435&lines=%D0%A3%D0%B4%D0%B0%D1%87%D0%B8+%D0%B4%D1%80%D1%83%D0%B7%D1%8C%D1%8F!)](https://git.io/typing-svg)
## [![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&duration=2000&pause=1000&color=6575F7&width=435&lines=%D0%9D%D0%B0%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5+%D0%B1%D0%B0%D0%B7%D1%8B)](https://git.io/typing-svg)
```sql
INSERT INTO "Accounts" ("Id", nickname, email, password, firstname, lastname, phonenumber)
VALUES 
    (gen_random_uuid(), 'john_doe', 'john.doe@example.com', 'securepass123', 'John', 'Doe', '+1234567890'),
    (gen_random_uuid(), 'jane_doe', 'jane.doe@example.com', 'janespass456', 'Jane', 'Doe', '+1987654321'),
    (gen_random_uuid(), 'alex_smith', 'alex.smith@example.com', 'alexpass789', 'Alex', 'Smith', '+1555666777');
```
В данном блоке можно посмотреть тестовые данные:

- В будущем **John** и **Jane** будут общаться друг с другом
- Они будут видеть сообщения и демки друг друга
- ⚠️ **Алекс** этого видеть не должен

## [![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&duration=2000&pause=1000&color=71F774&width=435&lines=%D0%A1%D0%B0%D0%BC%D0%B0+%D0%B1%D0%B0%D0%B7%D0%B0+%D0%B8+%D0%B2%D1%81%D0%B5+%D1%87%D1%82%D0%BE+%D1%81+%D0%BD%D0%B5%D0%B9+%D1%81%D0%B2%D1%8F%D0%B7%D0%B0%D0%BD%D0%BE)](https://git.io/typing-svg)
Для действий с аккаунтами используем таблицу в схеме public под названием accounts. Доступ к ней будет осуществляться по **public.account**

[!CAUTION]
## 🔒 Важная информация о безопасности

**Имейте в виду!** Для обеспечения безопасности:
- `ID` + `Password` закодированы!
  
### Об ID:
- Это `UUID` — очень длинный идентификатор  
- Пример: `330f8dfa-57cc-459e-b469-bb0572ce71fb` (для **john_doe** в моём случае)  
- ⚠️ У вас будет другой ID!  

### О Password:
- Кодируется по хэшу (необратимое преобразование)  
- Раскодировать **нельзя**  
- Но! Можно проверить соответствие введённой комбинации хэшу  

### Как это работает:
```bash
npm install bcryptjs
```
У вас это будет делаться следующим образом через библиотку npm install bcryptjs
```js
import * as bcrypt from 'bcryptjs';

// Хеширование пароля (аналог вашего C# кода)
const hashPassword = (plainPassword: string): string => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainPassword, salt);
};

// Проверка пароля против хеша
const verifyPassword = (plainPassword: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

// Пример использования
const userPassword = "mySecurePassword123";
const hashed = hashPassword(userPassword);

console.log("Hashed password:", hashed);

// Проверка пароля
const isMatch = verifyPassword("mySecurePassword123", hashed);
console.log("Password matches:", isMatch); // true

const isWrongMatch = verifyPassword("wrongPassword", hashed);
console.log("Wrong password matches:", isWrongMatch); // false
```
**Посмотрите тут, этот код генерил не я, а deepseek, но это лучше чем ничего, тк на JS я библиотеку не знаю.**

## [![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&duration=2000&pause=1000&color=F75E29&width=435&lines=%D0%A1%D0%B0%D0%BC%D0%B0+%D1%82%D0%B0%D0%B1%D0%BB%D0%B8%D1%86%D0%B0+Accounts)](https://git.io/typing-svg)

Сама таблица представляет собой следующее:
* Id - `uuid`
* nickname -string
* email -string (опционально)
* password -string(но как бы хэш код)
* firstname -string (опционально)
* lastname -string (опционально)
* phonenumber -string (опционально)

Пока сделаем все `опционально`, потом добавим проверку на наличие или email или телефона




