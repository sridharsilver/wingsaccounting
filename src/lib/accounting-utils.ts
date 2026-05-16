export const calculateGST = (rate: number, amount: number, isInterState: boolean) => {
  const totalTax = (amount * rate) / 100;
  if (isInterState) {
    return { 
      igst: totalTax, 
      cgst: 0, 
      sgst: 0, 
      totalTax 
    };
  } else {
    return { 
      igst: 0, 
      cgst: totalTax / 2, 
      sgst: totalTax / 2, 
      totalTax 
    };
  }
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const calculateInvoiceTotals = (items: any[], isInterState: boolean) => {
  return items.reduce((acc, item) => {
    const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
    const tax = calculateGST((Number(item.gst_rate) || 0), amount, isInterState);
    
    return {
      subtotal: acc.subtotal + amount,
      total_tax: acc.total_tax + tax.totalTax,
      total_amount: acc.total_amount + amount + tax.totalTax,
      cgst: acc.cgst + tax.cgst,
      sgst: acc.sgst + tax.sgst,
      igst: acc.igst + tax.igst,
    };
  }, { subtotal: 0, total_tax: 0, total_amount: 0, cgst: 0, sgst: 0, igst: 0 });
};

export function numberToIndianWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
  }

  if (num === 0) return "Zero";

  let words = "";
  let n = Math.floor(num);

  if (Math.floor(n / 10000000) > 0) {
    words += convertLessThanThousand(Math.floor(n / 10000000)) + " Crore ";
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    words += convertLessThanThousand(Math.floor(n / 100000)) + " Lakh ";
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    words += convertLessThanThousand(Math.floor(n / 1000)) + " Thousand ";
    n %= 1000;
  }
  words += convertLessThanThousand(n);

  return words.trim() + " Rupees Only";
}
