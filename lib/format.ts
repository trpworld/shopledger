export function roundMoney(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100
}

export function formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount)
}
