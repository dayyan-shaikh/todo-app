import { Button } from "~/components/ui/button";

export function Welcome() {
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <Button className="bg-blue-600 hover:bg-blue-500">
        Hello
      </Button>
    </main>
  );
}
