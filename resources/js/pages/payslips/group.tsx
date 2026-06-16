import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useAuth } from '@/lib/auth';
import { Head, Link, router } from '@inertiajs/react';
import { Download, Eye, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface EmployeeSummary {
    id: number;
    first_name: string;
    last_name: string;
    employee_number: string;
}

interface PayrollSummary {
    id: number;
    payroll_period: string;
    month: string;
    year: number;
}

interface PayslipItem {
    id: number;
    payroll_id: number;
    employee_id: number;
    payroll_period: string;
    month: string;
    year: number;
    net_pay: string;
    adjustments: string | number | null;
    generated_at: string | null;
    is_archived: boolean;
    employee: EmployeeSummary;
    payroll: PayrollSummary | null;
}

interface PaginatedPayslips {
    data: PayslipItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    payslips: PaginatedPayslips;
    period: string;
    month: string;
    year: number;
}

export default function PayslipsGroup({
    payslips: initialPayslips,
    period,
    month,
    year,
}: Props) {
    const user = useAuth();
    const [payslips, setPayslips] = useState(initialPayslips);
    const [isDownloading, setIsDownloading] = useState(false);
    const [incentivesMap, setIncentivesMap] = useState<Record<number, string>>(
        {},
    );
    const [adjustmentsMap, setAdjustmentsMap] = useState<Record<number, string>>(
        {},
    );
    const [isSavingAll, setIsSavingAll] = useState(false);

    const breadcrumbs = [
        { title: 'Payslips', href: '/payslips' },
        {
            title: `${period} - ${month} ${year}`,
            href: `/payslips/group/${encodeURIComponent(period)}/${month}/${year}`,
        },
    ];

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(parseFloat(amount));
    };

    const formatDateTime = (value: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleSaveAllIncentives = () => {
        // Collect all payslips that need incentives or adjustments to be saved
        const payslipsToSave = payslips.data.filter(
            (p) => incentivesMap[p.id] !== undefined || adjustmentsMap[p.id] !== undefined,
        );

        if (payslipsToSave.length === 0) {
            toast.error('No changes to save');
            return;
        }

        setIsSavingAll(true);
        let successCount = 0;
        let failureCount = 0;

        const saveNextPayslip = (index: number) => {
            if (index >= payslipsToSave.length) {
                // All done
                setIncentivesMap({});
                setAdjustmentsMap({});

                if (successCount > 0) {
                    toast.success(
                        `Saved changes for ${successCount} payslip${successCount !== 1 ? 's' : ''}`,
                    );
                }
                if (failureCount > 0) {
                    toast.error(
                        `Failed to save changes for ${failureCount} payslip${failureCount !== 1 ? 's' : ''}`,
                    );
                }
                setIsSavingAll(false);
                return;
            }

            const payslip = payslipsToSave[index];
            
            // Get incentive value: use map value if present, otherwise current payslip value
            const incentiveInput = incentivesMap[payslip.id]?.trim();
            const incentivesValue = incentiveInput !== undefined 
                ? parseFloat(incentiveInput) 
                : parseFloat(String(payslip.incentives || '0'));

            // Get adjustment value: use map value if present, otherwise current payslip value
            const adjustmentInput = adjustmentsMap[payslip.id]?.trim();
            const adjustmentsValue = adjustmentInput !== undefined 
                ? parseFloat(adjustmentInput) 
                : parseFloat(String(payslip.adjustments || '0'));

            if (Number.isNaN(incentivesValue) || incentivesValue < 0 || Number.isNaN(adjustmentsValue)) {
                failureCount++;
                saveNextPayslip(index + 1);
                return;
            }

            router.put(
                `/payslips/${payslip.id}`,
                { 
                    incentives: incentivesValue,
                    adjustments: adjustmentsValue
                },
                {
                    onSuccess: () => {
                        successCount++;
                        // Update the payslip data locally
                        setPayslips((prev) => ({
                            ...prev,
                            data: prev.data.map((p) =>
                                p.id === payslip.id
                                    ? {
                                          ...p,
                                          incentives: incentivesValue,
                                          adjustments: adjustmentsValue,
                                          // Calculate approximate new net pay for display (backend does real calc)
                                          // This is a simple client-side update for immediate feedback
                                          // Net Pay = (Base Gross + Incentives + Adjustments) - Deductions
                                          // We can approximate the change diff
                                          net_pay: String(
                                              parseFloat(p.net_pay) 
                                              - parseFloat(String(p.incentives || 0)) 
                                              - parseFloat(String(p.adjustments || 0))
                                              + incentivesValue 
                                              + adjustmentsValue
                                          )
                                      }
                                    : p,
                            ),
                        }));
                        // Save next payslip
                        saveNextPayslip(index + 1);
                    },
                    onError: (errors) => {
                        failureCount++;
                        console.error(
                            `Failed to save payslip ${payslip.id}:`,
                            errors,
                        );
                        // Save next payslip
                        saveNextPayslip(index + 1);
                    },
                },
            );
        };

        saveNextPayslip(0);
    };

    const handleDownloadAllPayslips = async () => {
        if (payslips.data.length === 0) {
            toast.error('No payslips to download');
            return;
        }

        setIsDownloading(true);
        try {
            const JSZip = (await import('jszip')).default;
            const html2canvas = (await import('html2canvas-pro')).default;

            const zip = new JSZip();
            let successCount = 0;

            // Download each payslip
            for (const payslip of payslips.data) {
                try {
                    // Fetch payslip data from API
                    const response = await fetch(`/api/payslips/${payslip.id}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch payslip data');
                    }

                    const data = await response.json();
                    const html = data.html;

                    // Create a temporary container with the payslip card HTML from Blade template
                    const container = document.createElement('div');
                    container.style.position = 'absolute';
                    container.style.left = '-9999px';
                    container.style.top = '0';
                    container.style.width = '384px';
                    container.style.backgroundColor = '#ffffff';
                    container.innerHTML = html;
                    document.body.appendChild(container);

                    // Wait for content to render
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    // Capture the payslip card
                    const payslipElement = container.querySelector(
                        '#payslip-card',
                    ) as HTMLElement;
                    if (payslipElement) {
                        const canvas = await html2canvas(payslipElement, {
                            scale: 2,
                            backgroundColor: '#ffffff',
                            useCORS: true,
                            allowTaint: true,
                            logging: false,
                        });

                        const imageData = canvas
                            .toDataURL('image/png')
                            .split(',')[1];
                        const filename = `payslip_${payslip.employee.last_name},${payslip.employee.first_name}.png`;
                        zip.file(filename, imageData, { base64: true });
                        successCount++;
                    } else {
                        console.warn(
                            `Payslip card element not found for ${payslip.employee.first_name} ${payslip.employee.last_name}`,
                        );
                    }

                    // Remove container
                    document.body.removeChild(container);
                } catch (error) {
                    console.error(
                        `Failed to download payslip for ${payslip.employee.first_name} ${payslip.employee.last_name}`,
                        error,
                    );
                }
            }

            if (successCount === 0) {
                toast.error('Failed to download any payslips');
                setIsDownloading(false);
                return;
            }

            // Generate and download ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `payslips_${period}_${month}_${year}.zip`;
            link.click();
            URL.revokeObjectURL(link.href);

            toast.success(
                `Downloaded ${successCount} of ${payslips.data.length} payslips`,
            );
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download payslips');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payslips - ${period} ${month} ${year}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {period} - {month} {year}
                        </h1>
                        <p className="text-muted-foreground">
                            View payslips for this period
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {user?.role === 'admin' &&
                            (Object.keys(incentivesMap).length > 0 || Object.keys(adjustmentsMap).length > 0) && (
                                <Button
                                    onClick={handleSaveAllIncentives}
                                    disabled={isSavingAll}
                                    variant="default"
                                >
                                    {isSavingAll ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            )}
                        <Button
                            onClick={handleDownloadAllPayslips}
                            disabled={
                                isDownloading ||
                                payslips.data.length === 0 ||
                                payslips.data.some(
                                    (p) =>
                                        p.incentives === null ||
                                        p.adjustments === null,
                                )
                            }
                            title={
                                payslips.data.some(
                                    (p) =>
                                        p.incentives === null ||
                                        p.adjustments === null,
                                )
                                    ? 'All payslips must have incentives and adjustments set before downloading'
                                    : ''
                            }
                            variant="default"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download All
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Payslip Records</CardTitle>
                        <CardDescription>
                            {payslips.total} payslip
                            {payslips.total !== 1 ? 's' : ''} for {period} -{' '}
                            {month} {year}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payslips.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No payslips found.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Employee No.</TableHead>
                                            {user?.role === 'admin' && (
                                                <>
                                                    <TableHead>Incentives</TableHead>
                                                    <TableHead>Adjustments</TableHead>
                                                </>
                                            )}
                                            <TableHead>Net Pay</TableHead>
                                            <TableHead>Generated At</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payslips.data.map((payslip) => (
                                            <TableRow key={payslip.id}>
                                                <TableCell>
                                                    <span className="font-medium">
                                                        {
                                                            payslip.employee
                                                                .first_name
                                                        }{' '}
                                                        {
                                                            payslip.employee
                                                                .last_name
                                                        }
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        payslip.employee
                                                            .employee_number
                                                    }
                                                </TableCell>
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {payslip.incentives === null || incentivesMap[payslip.id] !== undefined ? (
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        className="h-8 w-24 rounded border border-gray-300 px-2 text-sm"
                                                                        value={incentivesMap[payslip.id] ?? (payslip.incentives === null ? '' : String(payslip.incentives))}
                                                                        onChange={(e) =>
                                                                            setIncentivesMap((prev) => ({
                                                                                ...prev,
                                                                                [payslip.id]: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <span className="text-sm font-medium">
                                                                            {formatCurrency(String(payslip.incentives || '0'))}
                                                                        </span>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() =>
                                                                                setIncentivesMap((prev) => ({
                                                                                    ...prev,
                                                                                    [payslip.id]: String(payslip.incentives || '0'),
                                                                                }))
                                                                            }
                                                                        >
                                                                            Edit
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {adjustmentsMap[payslip.id] !== undefined ? (
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        className="h-8 w-24 rounded border border-gray-300 px-2 text-sm"
                                                                        value={adjustmentsMap[payslip.id]}
                                                                        onChange={(e) =>
                                                                            setAdjustmentsMap((prev) => ({
                                                                                ...prev,
                                                                                [payslip.id]: e.target.value,
                                                                            }))
                                                                        }
                                                                        autoFocus
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <span className="text-sm font-medium">
                                                                            {formatCurrency(String(payslip.adjustments || '0'))}
                                                                        </span>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() =>
                                                                                setAdjustmentsMap((prev) => ({
                                                                                    ...prev,
                                                                                    [payslip.id]: String(payslip.adjustments || '0'),
                                                                                }))
                                                                            }
                                                                        >
                                                                            Edit
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                )}
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(
                                                        payslip.net_pay,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDateTime(
                                                        payslip.generated_at,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/payslips/${payslip.id}`}
                                                        >
                                                                                                                                <Button
                                                                                                                                    size="sm"
                                                                                                                                    variant="outline"
                                                                                                                                >
                                                                                                                                    <Eye className="h-4 w-4" />
                                                                                                                                </Button>                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
