import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  breadcrumbs,
  titleClassName = "text-5xl",
}: {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  titleClassName?: string;
}) {
  return (
    <section className="max-w-5xl">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            {breadcrumbs.map((item, index) => {
              const isCurrent = index === breadcrumbs.length - 1 || !item.href;

            return (
              <li key={`${item.label}-${index}`} className="contents">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-[var(--neutral)]">
                    /
                  </span>
                ) : null}
                  {isCurrent || !item.href ? (
                    <span className="font-semibold text-[var(--foreground)]">{item.label}</span>
                  ) : (
                    <Link
                      href={item.href}
                      className="transition hover:text-[var(--primary)]"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <p className="eyebrow">{eyebrow}</p>
      <h1 className={`mt-4 ${titleClassName}`}>{title}</h1>
      <p className="muted mt-5 max-w-3xl text-lg leading-8">{description}</p>
    </section>
  );
}
