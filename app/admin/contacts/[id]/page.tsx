import { ContactDetail } from "@/features/contacts/contact-detail";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContactDetail id={id} />;
}
