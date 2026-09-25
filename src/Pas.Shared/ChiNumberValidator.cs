using System.Globalization;
using System.Text.RegularExpressions;

namespace Pas.Shared;

public class ChiNumberValidator : INationalIdentifierValidator
{
    private static readonly Regex DigitRegex = new(@"^\d{10}$");

    public string IdentifierName => "CHI";

    public bool Validate(string? chiNumber)
    {
        if (string.IsNullOrWhiteSpace(chiNumber))
            return false;

        var cleanNumber = chiNumber.Replace(" ", "").Replace("-", "");

        if (!DigitRegex.IsMatch(cleanNumber))
            return false;

        // Verify date of birth part (first 6 digits: DDMMYY)
        var dobPart = cleanNumber.Substring(0, 6);
        if (!DateTime.TryParseExact(dobPart, "ddMMyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
        {
            return false;
        }

        // Modulus 11 check (identical weights to NHS number)
        var sum = 0;
        var weights = new[] { 10, 9, 8, 7, 6, 5, 4, 3, 2 };

        for (int i = 0; i < 9; i++)
        {
            sum += (cleanNumber[i] - '0') * weights[i];
        }

        var remainder = sum % 11;
        int computedCheck;

        if (remainder == 0)
        {
            computedCheck = 0;
        }
        else
        {
            computedCheck = 11 - remainder;
            if (computedCheck == 10)
            {
                // Resulting check digit of 10 is invalid
                return false;
            }
        }

        var actualCheckDigit = cleanNumber[9] - '0';
        return computedCheck == actualCheckDigit;
    }
}
