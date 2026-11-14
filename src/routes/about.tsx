import { createFileRoute } from '@tanstack/react-router';
import { InfoPage, infoHead } from '@/components/info-page';

export const Route = createFileRoute('/about')({
  staticData: { sitemap: true },
  head: () => infoHead('About Us', "Fresh Teacher's Library empowers educators across Uganda with curriculum-aligned notes, schemes of work and past papers."),
  component: () => <InfoPage title="About Fresh Teacher's Library" sections={[
    { heading: 'Our Mission', body: ["Fresh Teacher's Library is dedicated to empowering educators across Uganda by providing comprehensive, curriculum-aligned educational resources. We strive to make quality teaching materials accessible to all teachers, from nursery to senior six, supporting educational excellence throughout the country."] },
    { heading: 'Who We Serve', body: ["Our platform serves teachers, administrators, and educational professionals working within the Uganda curriculum framework. Whether you're teaching at nursery level, primary school, or secondary school, we provide the resources you need to deliver effective and engaging lessons."] },
    { heading: 'What We Offer', body: ['Our comprehensive library includes:'], list: ['Detailed lesson notes for all subjects and class levels', 'Comprehensive schemes of work for curriculum planning', 'Past examination papers with marking guides', 'Holiday packages for continuous learning', 'Digital textbooks and reference materials'], after: ['All resources are carefully curated to align with the Uganda curriculum standards, ensuring that teachers have access to accurate, relevant, and up-to-date materials.'] },
    { heading: 'Our Commitment', body: ["We are committed to continuously updating and expanding our resource collection to meet the evolving needs of Uganda's education system. Our team works tirelessly to ensure that every teacher has access to the tools they need to inspire and educate the next generation of learners."] },
  ]} />,
});
