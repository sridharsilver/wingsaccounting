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
    const amount = Number(item.qty) * Number(item.rate);
    const tax = calculateGST(Number(item.gst_rate), amount, isInterState);
    
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
