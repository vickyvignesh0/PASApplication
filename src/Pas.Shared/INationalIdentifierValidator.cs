namespace Pas.Shared;

public interface INationalIdentifierValidator
{
    string IdentifierName { get; }
    bool Validate(string? identifierValue);
}
