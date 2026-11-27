import JsonLd from "@/app/components/JsonLd";
import { loadQuizConfig } from "@/lib/security-assessment";
import { getBreadcrumbSchema, getFAQPageSchema } from "@/lib/schema";
import SecurityAssessmentQuiz from "./SecurityAssessmentQuiz";

export default function SecurityAssessmentPage() {
  const config = loadQuizConfig();

  const faqEntries = config.questions.map((question) => {
    const bestAnswer = question.answers.reduce((best, answer) =>
      answer.points > best.points ? answer : best,
    );
    return {
      question: question.text,
      answer: bestAnswer.text,
    };
  });

  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Security Assessment", url: "/security-assessment" },
        ])}
      />
      <JsonLd data={getFAQPageSchema(faqEntries)} />
      <SecurityAssessmentQuiz config={config} />
    </>
  );
}
