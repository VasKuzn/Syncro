# Backend build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /src

COPY ["Syncro.Server/Syncro.Api/Syncro.Api.csproj", "Syncro.Api/"]
COPY ["Syncro.Server/Syncro.Application/Syncro.Application.csproj", "Syncro.Application/"]
COPY ["Syncro.Server/Syncro.Infrastructure/Syncro.Infrastructure.csproj", "Syncro.Infrastructure/"]
COPY ["Syncro.Server/Syncro.Domain/Syncro.Domain.csproj", "Syncro.Domain/"]

RUN cd Syncro.Api && dotnet restore

COPY Syncro.Server/ .

WORKDIR "/src/Syncro.Api"
RUN dotnet publish -c Release -o /app/publish

# Backend runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Syncro.Api.dll"]
