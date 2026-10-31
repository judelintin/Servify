import { ButtonLink, Card, EmptyState, PageHeading } from "@/components/ui/primitives";

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <><PageHeading eyebrow="Workspace preview" title={title} description={description}/><Card><EmptyState title="A space for what comes next." description="This part of Servify is being prepared. There are no live records or actions here yet." action={<ButtonLink href="/" variant="secondary" icon="arrow-left">Back to Servify</ButtonLink>}/></Card></>
  );
}
