import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export function App() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="text-3xl text-primary">Mornigami</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-secondary">
            Phase 1 Foundation Initialized with React, TailwindCSS & shadcn/ui.
          </p>
          <Button>Explore Mornigami</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
