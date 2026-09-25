using Marten;
using Marten.Events.Projections;
using MassTransit;
using Pas.MpiService;
using Pas.MpiService.Application;
using Pas.MpiService.Controllers;
using Pas.Shared;
using Pas.ServiceDefaults;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults and OpenTelemetry configuration
builder.AddServiceDefaults();

// Add Application Services & Validators
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddSingleton<INationalIdentifierValidator, NhsNumberValidator>();
builder.Services.AddSingleton<INationalIdentifierValidator, ChiNumberValidator>();
builder.Services.AddSingleton<INationalIdentifierValidator, IhiNumberValidator>();

// Add Controllers
builder.Services.AddControllers();

// Configure OpenAPI/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure JWT Authentication
var secretKey = AuthController.SecretKey;
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = AuthController.Issuer,
        ValidAudience = AuthController.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

// Configure CORS for Angular frontend compatibility
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure Marten (Event Sourcing + Document Store on PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("pasdb") 
                       ?? "Host=localhost;Port=5432;Database=pasdb;Username=postgres;Password=postgres;Maximum Pool Size=50;";

builder.Services.AddMarten(sp =>
{
    var options = new StoreOptions();
    options.Connection(connectionString);
    options.Events.MetadataConfig.HeadersEnabled = true;

    // Enable inline snapshot projection for the Patient aggregate.
    // Whenever a Patient event is appended to the stream, Marten updates the projected Patient document table inline.
    options.Projections.Snapshot<Patient>(SnapshotLifecycle.Inline);
    return options;
});

// Configure MassTransit with RabbitMQ
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitmqHost = builder.Configuration.GetConnectionString("rabbitmq") 
                           ?? "rabbitmq://localhost";
        
        cfg.Host(new Uri(rabbitmqHost), h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

// Enable developer visual swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

// Map default health and live checks from ServiceDefaults
app.MapDefaultEndpoints();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed Database on Startup
using (var scope = app.Services.CreateScope())
{
    var documentStore = scope.ServiceProvider.GetRequiredService<IDocumentStore>();
    await DbSeeder.SeedDataAsync(documentStore);
}

app.Run();
