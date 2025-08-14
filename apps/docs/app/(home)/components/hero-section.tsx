import { CopyButton } from '../../../components/ui/copy-button';
import { Button } from '../../../components/ui/button';

export function HeroSection() {
  const installCommand = 'pnpm add @solana-commerce/react-sdk';

  return (
    <section 
    className="flex flex-1 flex-col justify-center p-4"
    style={{
      backgroundImage: `repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(46, 77, 97, 0.08) 10px,
        rgba(46, 77, 97, 0.08) 11px
      )`
    }}
    >
      <div className="w-full space-y-2 bg-zinc-100 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Solana Development Kit
        </h1>
        <p className="text-md text-gray-600 dark:text-gray-400 max-w-2xl mb-8">
          CommerceKit is a robust set of tooling examples for utilzing payments in your applications.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Button 
            className=""
            variant="default"
            size="lg"
            onClick={() => {
              window.location.href = '/docs/quick-start';
            }}
          >
            Get Started
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border">
            <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {installCommand}
            </code>
            <CopyButton 
              textToCopy={installCommand}
              showText={false}
              className="p-1"
              iconClassName="h-4 w-4"
            />
          </div>
        </div>
      </div>
    </section>
  );
} 