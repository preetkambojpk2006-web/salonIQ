import { Suspense } from "react";
import { CustomersView } from "@/components/command-center/customers-view";
import { listCustomers } from "@/lib/customers/queries";

type CustomersPageProps = {
  searchParams: { q?: string; error?: string; added?: string };
};

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const customers = await listCustomers(searchParams.q);

  return (
    <Suspense fallback={null}>
      <CustomersView
        initialCustomers={customers}
        initialQuery={searchParams.q ?? ""}
        error={searchParams.error}
        showAddedToast={searchParams.added === "1"}
      />
    </Suspense>
  );
}
