import { createFileRoute } from '@tanstack/react-router';
import { InfoPage, infoHead } from '@/components/info-page';

export const Route = createFileRoute('/terms')({
  staticData: { sitemap: true },
  head: () => infoHead('Terms of Service', "The terms that apply when you access and use Fresh Teacher's Library educational resources."),
  component: () => <InfoPage title="Terms of Service" sections={[
    { heading: 'Acceptance of Terms', body: ["By accessing and using Fresh Teacher's Library, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access or use our services."] },
    { heading: 'Use of Educational Resources', body: ['You agree to use our educational resources only for legitimate educational purposes, including:'], list: ['Teaching and instruction in educational institutions', 'Personal professional development as an educator', 'Educational research and curriculum development'] },
    { heading: 'Prohibited Uses', body: ['You agree not to:'], list: ['Reproduce, distribute, or sell any materials for commercial purposes', 'Remove copyright notices or attribution from any resources', 'Use the platform to distribute malicious software or content', 'Attempt to gain unauthorized access to our systems', 'Violate any applicable laws or regulations'] },
    { heading: 'User Accounts', body: ['If you create an account with us, you are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.'] },
    { heading: 'Intellectual Property Rights', body: ["Some of the materials on Fresh Teacher's Library may be protected by copyright and other intellectual property laws. We grant you a limited, non-exclusive, non-transferable license to access and use these educational resources for permitted educational purposes only."] },
    { heading: 'Service Availability', body: ['We strive to maintain continuous service availability but cannot guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of our services at any time without prior notice.'] },
    { heading: 'Termination', body: ['We may terminate or suspend your access to our services immediately, without prior notice, if you breach these Terms of Service or engage in any conduct that we determine to be inappropriate or harmful to our platform or other users.'] },
    { heading: 'Changes to Terms', body: ['We reserve the right to modify these Terms of Service at any time. Your continued use of our services after such changes constitutes acceptance of the new terms.'] },
  ]} />,
});
