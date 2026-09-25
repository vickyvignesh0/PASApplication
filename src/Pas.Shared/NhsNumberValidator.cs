using System.Text.RegularExpressions;

namespace Pas.Shared;

public class NhsNumberValidator : INationalIdentifierValidator
{
    private static readonly Regex DigitRegex = new(@"^\d{10}$");

    public string IdentifierName => "NHS";

    public bool Validate(string? nhsNumber)
    {
        if (string.IsNullOrWhiteSpace(nhsNumber))
            return false;

        // Clean spaces and hyphens
        var cleanNumber = nhsNumber.Replace(" ", "").Replace("-", "");

        // Must be exactly 10 digits
        if (!DigitRegex.IsMatch(cleanNumber))
            return false;

        // Modulus 11 check
        var sum = 0;
        var weights = new[] { 10, 9, 8, 7, 6, 5, 4, 3, 2 };

        for (int i = 0; i < 9; i++)
        {
            sum += (cleanNumber[i] - '0') * weights[i];
        }

        var remainder = sum % 11;
        var computedCheck = 11 - remainder;

        if (computedCheck == 11)
        {
            computedCheck = 0;
        }
        else if (computedCheck == 10)
        {
            // NHS Numbers yielding a checksum of 10 are invalid
            return false;
        }

        var actualCheckDigit = cleanNumber[9] - '0';
        return computedCheck == actualCheckDigit;
    }
}
