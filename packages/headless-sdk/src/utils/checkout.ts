import type { CheckoutStep, CheckoutStepId, Mode } from '../types/checkout';

export function getCheckoutSteps(mode: Mode): CheckoutStep[] {
    return [
        { id: 'details', name: 'Details', completed: false, active: true },
        { id: 'payment', name: 'Payment', completed: false, active: false },
        { id: 'confirmation', name: 'Confirmation', completed: false, active: false },
    ];
}
