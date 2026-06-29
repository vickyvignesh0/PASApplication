using Projects;

var builder = DistributedApplication.CreateBuilder(args);

// Define Redis container for patient waiting list counts and distributed sessions
var redis = builder.AddRedis("redis");

// Define RabbitMQ container for decoupled microservices messaging
var rabbitmq = builder.AddRabbitMQ("rabbitmq");

// Define Postgres database container and register "pasdb" database
var postgres = builder.AddPostgres("postgres");
var pasDb = postgres.AddDatabase("pasdb");

// Register MpiService and inject DB, event broker, and cache references
builder.AddProject<Pas_MpiService>("mpiservice")
    .WithReference(pasDb)
    .WithReference(rabbitmq)
    .WithReference(redis);

builder.Build().Run();
