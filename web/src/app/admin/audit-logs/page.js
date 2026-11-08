import AuditLogsClient from "./components/AuditLogsClient";

export const metadata = {
  title: "Audit Logs & Security Trails | Admin Panel",
  description: "Comprehensive audit trails of administrative activities, status changes, and courier dispatches.",
};

export default function AuditLogsPage(props) {
  return <AuditLogsClient {...props} />;
}

