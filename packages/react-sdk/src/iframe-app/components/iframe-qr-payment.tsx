// This is the iframe-safe version of QRPaymentContent
// It's the same as the original but without any ui-primitives dependencies

export { QRPaymentContent } from '../../components/tip-modal/qr-payment-content';

// The QRPaymentContent component doesn't use DialogClose or any ui-primitives
// so we can just re-export it directly
