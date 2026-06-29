using System.Text.RegularExpressions;

namespace Pas.Shared;

public static class IhiNumberValidator
{
    private static readonly Regex DigitRegex = new(@"^\d{10}$");

    public static bool Validate(string? ihiNumber)
    {
        if (string.IsNullOrWhiteSpace(ihiNumber))
            return false;

        var cleanNumber = ihiNumber.Replace(" ", "").Replace("-", "");

        if (!DigitRegex.IsMatch(cleanNumber))
            return false;

        // IHIs in Ireland typically start with 80
        if (!cleanNumber.StartsWith("80"))
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
            return false;
        }

        var actualCheckDigit = cleanNumber[9] - '0';
        return computedCheck == actualCheckDigit;
    }
}
