import { Button } from '@/components/ui/button';

export default function SubscriptionStatus({ checking, retry }: {
  checking: boolean;
  retry: () => unknown;
}) {
  return <div className="space-y-3 py-4" role="status">
    <p className="text-sm text-muted-foreground">{checking
      ? 'Checking your subscription…'
      : 'We could not verify your subscription. Please try again before purchasing or using Pro features.'}</p>
    {!checking && <Button variant="outline" onClick={() => { void retry(); }}>Retry subscription check</Button>}
  </div>;
}
