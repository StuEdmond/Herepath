import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { DifficultyGauge, DIFFICULTY_LABELS } from "@/components/ui/difficulty-gauge";
import { TripTypeBadge } from "@/components/ui/trip-type-badge";
import { Tag } from "@/components/ui/tag";
import { Card, CardImage, CardBody } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { ThemePreviewToggle } from "@/components/theme-preview-toggle";

export const metadata: Metadata = {
  title: "Component preview",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-surface-raised pb-8">
      <h2 className="text-[20px]">{title}</h2>
      {children}
    </section>
  );
}

export default function PreviewPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-4 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px]">Component preview</h1>
          <p className="text-text-secondary">
            Herepath design system — light and dark follow the device setting; use the toggle
            below to preview both while building.
          </p>
        </div>
        <ThemePreviewToggle />
      </div>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Ride this route</Button>
          <Button variant="secondary">Download GPX</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Delete entry</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Star rating">
        <div className="flex flex-wrap items-center gap-6">
          <StarRating rating={4.7} reviewCount={128} />
          <StarRating rating={3.2} />
        </div>
      </Section>

      <Section title="Difficulty gauge">
        <div className="flex flex-wrap gap-6">
          {([1, 2, 3, 4, 5] as const).map((level) => (
            <DifficultyGauge key={level} level={level} />
          ))}
        </div>
        <ul className="grid gap-1 text-[13px] text-text-secondary sm:grid-cols-2">
          {DIFFICULTY_LABELS.map((label, i) => (
            <li key={label}>
              <span className="text-text-primary">{i + 1}. {label}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Trip type badges">
        <div className="flex flex-wrap gap-3">
          <TripTypeBadge type="route" />
          <TripTypeBadge type="day-ride" />
          <TripTypeBadge type="tour" />
        </div>
      </Section>

      <Section title="Tags">
        <div className="flex flex-wrap gap-2">
          <Tag variant="suited">Suited: Adventure</Tag>
          <Tag variant="caution">Caution: Sports</Tag>
          <Tag variant="neutral">Reservoir</Tag>
          <Tag variant="neutral">Mountain pass</Tag>
        </div>
      </Section>

      <Section title="Stat tiles">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Distance" value="24 miles" />
          <StatTile label="Riding time" value="55 min" />
          <StatTile label="Road surface" value="Good" />
          <StatTile
            label="Difficulty"
            value={<DifficultyGauge level={3} showLabel={false} />}
          />
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardImage alt="Snake Pass" badge={<TripTypeBadge type="route" />} />
            <CardBody>
              <h3 className="text-[17px]">Snake Pass (A57)</h3>
              <p className="text-[13px] text-text-muted">Peak District</p>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-secondary">24 miles</span>
                <StarRating rating={4.6} reviewCount={82} />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Tag variant="suited">Adventure</Tag>
                <Tag variant="neutral">Reservoir</Tag>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardImage alt="Dark Peak loop" badge={<TripTypeBadge type="day-ride" />} />
            <CardBody>
              <h3 className="text-[17px]">Dark Peak loop</h3>
              <p className="text-[13px] text-text-muted">Peak District</p>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-secondary">95 miles</span>
                <StarRating rating={4.8} reviewCount={41} />
              </div>
            </CardBody>
          </Card>
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px]">Heading 1 · Archivo Narrow 500</h1>
          <h2 className="text-[22px]">Heading 2 · Archivo Narrow 500</h2>
          <h3 className="text-[17px]">Heading 3 · Archivo Narrow 500</h3>
          <p className="text-[15px]">
            Body text in Archivo 400. Sentence case everywhere, no all-caps headings.
          </p>
          <p className="text-[15px] font-medium">Body text in Archivo 500 (medium).</p>
        </div>
      </Section>
    </div>
  );
}
