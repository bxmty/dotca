export interface FaqItem {
  question: string;
  answer: string;
}

/** FAQ accordion on native <details>; items open and close independently. */
export default function FaqList({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="accordion">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <details
            key={item.question}
            className={`accordion-item faq-item border${isLast ? "" : " mb-3"}`}
            open={index === 0}
          >
            <summary className="accordion-button fw-medium">
              <h3 className="fs-6 fw-medium m-0">{item.question}</h3>
            </summary>
            <div className="accordion-body text-body-secondary">
              {item.answer}
            </div>
          </details>
        );
      })}
    </div>
  );
}
