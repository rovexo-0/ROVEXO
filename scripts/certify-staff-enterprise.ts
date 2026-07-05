import { runStaffEnterpriseCertification } from "@/lib/staff-enterprise/certification";

const report = runStaffEnterpriseCertification();
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exit(1);
