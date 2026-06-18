import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

const QA = [
  { q: 'q1', a: 'a1' }, { q: 'q2', a: 'a2' }, { q: 'q3', a: 'a3' },
  { q: 'q4', a: 'a4' }, { q: 'q5', a: 'a5' },
] as const;

export function Faq() {
  const t = useTranslations('Faq');
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: QA.map(({ q, a }) => ({
      '@type': 'Question',
      name: t(q),
      acceptedAnswer: { '@type': 'Answer', text: t(a) },
    })),
  };
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <MotionReveal>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
      </MotionReveal>
      <MotionReveal delay={0.1}>
        <Accordion type="single" collapsible className="mt-8">
          {QA.map(({ q, a }) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{t(q)}</AccordionTrigger>
              <AccordionContent>{t(a)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </MotionReveal>
    </section>
  );
}
