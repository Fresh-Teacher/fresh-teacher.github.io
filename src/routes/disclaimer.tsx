import { createFileRoute } from '@tanstack/react-router';
import { InfoPage, infoHead } from '@/components/info-page';

export const Route = createFileRoute('/disclaimer')({
  staticData: { sitemap: true },
  head: () => infoHead('Disclaimer', "How Fresh Teacher's Library resources may be used, their accuracy, curriculum alignment and limits of liability."),
  component: () => <InfoPage title="Disclaimer" sections={[
    { heading: 'Educational Use Only', body: ["The resources provided by Fresh Teacher's Library are intended solely for educational purposes. These materials are designed to support teaching and learning within the Uganda curriculum framework and should be used as supplementary educational aids."] },
    { heading: 'Accuracy of Information', body: ["While we strive to ensure the accuracy and currency of all educational materials, Fresh Teacher's Library makes no warranties or representations regarding the completeness, accuracy, or reliability of the content. Users are encouraged to verify information and adapt materials to their specific teaching contexts."] },
    { heading: 'Curriculum Alignment', body: ['Our resources are developed with the intention of aligning with the Uganda curriculum. However, curriculum requirements may change, and teachers are responsible for ensuring that materials meet current curriculum standards and learning objectives for their specific teaching situations.'] },
    { heading: 'Limitation of Liability', body: ["Fresh Teacher's Library shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use of our educational resources. Users assume full responsibility for the implementation and adaptation of materials in their educational settings."] },
    { heading: 'Intellectual Property', body: ["All content provided through Fresh Teacher's Library is for educational use only. Users may not reproduce, distribute, or sell any materials without explicit permission. Respect for intellectual property rights is essential for maintaining the quality and availability of educational resources."] },
    { heading: 'Updates and Changes', body: ['This disclaimer may be updated periodically to reflect changes in our services or legal requirements. Users are encouraged to review this disclaimer regularly to stay informed of any changes that may affect their use of our educational resources.'] },
  ]} />,
});
