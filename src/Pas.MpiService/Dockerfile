# Stage 1: Build and publish the .NET Web API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project configuration files to restore packages
COPY Pas.MpiService/Pas.MpiService.csproj Pas.MpiService/
COPY Pas.Shared/Pas.Shared.csproj Pas.Shared/
COPY Pas.ServiceDefaults/Pas.ServiceDefaults.csproj Pas.ServiceDefaults/
RUN dotnet restore Pas.MpiService/Pas.MpiService.csproj

# Copy all files and publish release assembly
COPY . .
RUN dotnet publish Pas.MpiService/Pas.MpiService.csproj -c Release -o /app/publish

# Stage 2: Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose API on port 5000
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "Pas.MpiService.dll"]
