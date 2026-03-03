import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container width="content" className="py-16 sm:py-20">
      <Card>
        <h1 className="text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-base text-text-muted">
          The requested page is not published in CMS, or the slug/locale does
          not exist.
        </p>
        <div className="mt-5">
          <ButtonLink href="/" variant="primary">
            Go to homepage
          </ButtonLink>
        </div>
      </Card>
    </Container>
  );
}
