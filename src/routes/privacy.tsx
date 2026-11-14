import { createFileRoute } from '@tanstack/react-router';
import { InfoPage, infoHead } from '@/components/info-page';

export const Route = createFileRoute('/privacy')({
  staticData: { sitemap: true },
  head: () => infoHead('Privacy Policy', "What information Fresh Teacher's Library collects, how it is used and protected, and your rights."),
  component: () => <InfoPage title="Privacy Policy" sections={[
    { heading: 'Information We Collect', body: ['We may collect the following types of information:'], list: ['Personal information you provide when creating an account', 'Usage data about how you interact with our platform', 'Technical information such as your IP address and browser type', 'Educational preferences and resource access patterns'] },
    { heading: 'How We Use Your Information', body: ['We use your information to:'], list: ['Provide and maintain our educational services', 'Improve and personalise your experience', 'Communicate with you about updates and new resources', 'Analyse usage patterns to enhance our platform', 'Ensure the security and integrity of our services'] },
    { heading: 'Information Sharing', body: ['We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with trusted partners who assist us in operating our platform, conducting our business, or serving our users, provided they agree to keep this information confidential.'] },
    { heading: 'Data Security', body: ['We implement appropriate security measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.'] },
    { heading: 'Cookies and Tracking', body: ['We use cookies and similar tracking technologies to enhance your browsing experience, analyse site traffic, and understand where our visitors are coming from. You can control cookie settings through your browser preferences, though some features may not function properly if cookies are disabled.'] },
    { heading: 'Your Rights', body: ['You have the right to:'], list: ['Access and review your personal information', 'Request corrections to inaccurate information', 'Request deletion of your personal information', 'Opt-out of certain communications', 'Export your data in a portable format'] },
    { heading: "Children's Privacy", body: ['Our services are designed for educators and educational professionals. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately so we can delete it.'] },
    { heading: 'Policy Updates', body: ['We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.'] },
    { heading: 'Contact Information', body: ['If you have any questions about this Privacy Policy or our data practices, please contact us through our platform. We are committed to addressing your concerns and protecting your privacy.'] },
  ]} />,
});
