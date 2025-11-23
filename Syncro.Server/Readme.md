# 👾 `Правки backend части`👾
[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&duration=2000&pause=1000&color=F76262&width=435&lines=%D0%A3%D0%B4%D0%B0%D1%87%D0%B8+%D0%B4%D1%80%D1%83%D0%B7%D1%8C%D1%8F!)](https://git.io/typing-svg)

## Миграция монолита на модульный монолит! 🙌


### На данный момент структура проекта стала трудноподдерживаемой, тяжелой.

### Было принято решение переводить проект на рельсы модульного монолита.

### Микросервисы было решено не делать(в будущем их можно выделить из модулей - для этого все готово!) ввиду недостаточной на начальном этапе нагрузки и характера проекта как pet-project на данном этапе.


## Что планируется сделать? 😊

* **Syncro.Core**
Сущности, доменные enum'ы, доменные исключения, интерфейсы для репозиториев/агрегатов.

😢НЕТ EF, нет внешних зависимостей.

* **Syncro.Application**
DTO, Use-cases / Services interfaces (IAccountService, ISectorPermissionsService и т.д.), запросы/команды, валидаторы, интерфейсы для операций высокого уровня.

🤨Здесь же Contract/Response/Request DTO, возможен MediatR.

* **Syncro.Infrastructure**
EF DbContext, миграции, реализации репозиториев, интеграции с внешними сервисами (S3/Selectel), реализация IJwtProvider и т.д.

Тут SaveChanges/UnitOfWork.

* **Syncro.Api**
Controllers, Program.cs, middleware, mapping (AutoMapper) и DI (регистрация инфраструктуры и application внедрений).

## God bless this project🙌🙌⛪⛪☦️✝️ 

lobster -> 🦞

holy crab hehe