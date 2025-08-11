// This is the iframe-safe version of WalletPaymentContent
// It's the same as the original but without any ui-primitives dependencies

export { WalletPaymentContent } from '../../components/tip-modal/wallet-payment-content';

// The WalletPaymentContent component doesn't use DialogClose or any ui-primitives
// so we can just re-export it directly
