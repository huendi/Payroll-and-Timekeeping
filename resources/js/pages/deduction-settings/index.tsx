import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { canEdit } from '@/lib/auth';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DeductionSetting {
    id: number;
    deduction_type: string;
    settings: Record<string, any>;
    created_at: string;
    updated_at: string;
}

interface SSSBracket {
    id: number;
    from: string;
    to: string;
    er: string;
    ee: string;
    total: string;
    others: string | null;
}

interface TaxBracket {
    id: number;
    from: string;
    to: string | null;
    percentage: string;
    fixed_amount: string | null;
}

interface PHICBracket {
    id: number;
    from: string;
    to: string | null;
    percentage: string;
    fixed_amount: string | null;
}

interface Props {
    settings: Record<string, DeductionSetting>;
    deductionTypes: Record<string, string>;
    sssBrackets: SSSBracket[];
    taxBrackets: TaxBracket[];
    phicBrackets: PHICBracket[];
}

const allDeductionTypes = [
    { key: 'late_absences', label: 'Late and Absences' },
    { key: 'loan_advances', label: 'Loans and Advances' },
    { key: 'phic', label: 'PHIC Contribution' },
    { key: 'hdmf', label: 'HDMF Contribution' },
    { key: 'sss_contribution', label: 'SSS Contribution' },
    { key: 'sss_loan', label: 'SSS Loan' },
    { key: 'hdmf_loan', label: 'HDMF Loan' },
    { key: 'income_tax', label: 'Income Tax' },
];

export default function DeductionSettingsIndex({
    settings,
    deductionTypes,
    sssBrackets,
    taxBrackets,
    phicBrackets,
}: Props) {
    const [showModal, setShowModal] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [sssBracketsData, setSSSBracketsData] =
        useState<SSSBracket[]>(sssBrackets);
    const [taxBracketsData, setTaxBracketsData] =
        useState<TaxBracket[]>(taxBrackets);
    const [phicBracketsData, setPHICBracketsData] =
        useState<PHICBracket[]>(phicBrackets);

    const settingsForm = useForm({
        days: '',
        rate: '',
        min_salary: '',
        max_salary: '',
        employer_share: '',
        employee_share: '',
        employee: '',
        employer: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Deduction Settings',
            href: '/deduction-settings',
        },
    ];

    const formatDate = (date: string | null) => {
        if (!date) return 'Not yet set';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatNumberWithCommas = (value: string | number | null): string => {
        if (value === null || value === undefined || value === '') {
            return 'N/A';
        }
        const num = parseFloat(String(value));
        if (isNaN(num)) {
            return String(value); // Return original if not a valid number
        }
        return num.toLocaleString('en-US'); // Formats with commas
    };

    const openModal = (type: string) => {
        setSelectedType(type);
        setIsEditMode(false);
        const setting = settings[type];

        settingsForm.setData({
            days: type === 'late_absences' ? setting.settings?.days || '' : '',
            rate: type === 'phic' ? setting.settings?.rate || '' : '',
            min_salary:
                type === 'phic' ? setting.settings?.min_salary || '' : '',
            max_salary:
                type === 'phic' ? setting.settings?.max_salary || '' : '',
            employer_share:
                type === 'phic' ? setting.settings?.employer_share || '' : '',
            employee_share:
                type === 'phic' ? setting.settings?.employee_share || '' : '',
            employee: type === 'hdmf' ? setting.settings?.employee || '' : '',
            employer: type === 'hdmf' ? setting.settings?.employer || '' : '',
        });

        setShowModal(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType) return;

        const setting = settings[selectedType];
        let data: Record<string, any> = {};

        if (selectedType === 'late_absences') {
            data = { days: settingsForm.data.days };
        } else if (selectedType === 'phic') {
            data = {
                rate: settingsForm.data.rate,
                min_salary: settingsForm.data.min_salary,
                max_salary: settingsForm.data.max_salary,
                employer_share: settingsForm.data.employer_share,
                employee_share: settingsForm.data.employee_share,
            };
        } else if (selectedType === 'hdmf') {
            data = {
                employee: settingsForm.data.employee,
                employer: settingsForm.data.employer,
            };
        }

        settingsForm.put(`/deduction-settings/${setting.id}`, {
            data,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Deduction setting updated successfully!');
                setShowModal(false);
                settingsForm.reset();
            },
            onError: () => {
                toast.error('Failed to update deduction setting.');
            },
        });
    };

    const getModalContent = (type: string): string => {
        switch (type) {
            case 'loan_advances':
                return 'Loans and Advances are employee-specific deductions. Each loan or advance is linked to an individual employee and tracked through employee deductions, including the amount, date, and payment schedule.';
            case 'sss_loan':
                return "SSS Loan is a fixed government loan deduction linked to an individual employee. The system tracks the loan amount and the payment schedule, and the monthly deduction is automatically applied to the employee's payslip.";
            case 'hdmf_loan':
                return "HDMF or Pag-IBIG Loan is a fixed government loan deduction linked to an individual employee. The system tracks the loan amount and the payment schedule, and the monthly deduction is automatically applied to the employee's payslip.";
            default:
                return '';
        }
    };

    const isEditableType = (type: string): boolean => {
        return ['late_absences', 'phic', 'hdmf'].includes(type);
    };

    const handleAddSSSBracket = () => {
        setSSSBracketsData([
            ...sssBracketsData,
            {
                id: 0,
                from: '',
                to: '',
                er: '',
                ee: '',
                total: '',
                others: null,
            },
        ]);
    };

    const handleAddTaxBracket = () => {
        setTaxBracketsData([
            ...taxBracketsData,
            {
                id: 0,
                from: '',
                to: null,
                percentage: '',
                fixed_amount: null,
            },
        ]);
    };

    const handleRemoveSSSBracket = (index: number) => {
        setSSSBracketsData(sssBracketsData.filter((_, i) => i !== index));
    };

    const handleRemoveTaxBracket = (index: number) => {
        setTaxBracketsData(taxBracketsData.filter((_, i) => i !== index));
    };

    const handleUpdateSSSBracket = (
        index: number,
        field: string,
        value: string,
    ) => {
        const updated = [...sssBracketsData];
        updated[index] = { ...updated[index], [field]: value };
        setSSSBracketsData(updated);
    };

    const handleUpdateTaxBracket = (
        index: number,
        field: string,
        value: string,
    ) => {
        const updated = [...taxBracketsData];
        updated[index] = { ...updated[index], [field]: value };
        setTaxBracketsData(updated);
    };

    const handleAddPHICBracket = () => {
        setPHICBracketsData([
            ...phicBracketsData,
            {
                id: 0,
                from: '',
                to: null,
                percentage: '',
                fixed_amount: null,
            },
        ]);
    };

    const handleRemovePHICBracket = (index: number) => {
        setPHICBracketsData(phicBracketsData.filter((_, i) => i !== index));
    };

    const handleUpdatePHICBracket = (
        index: number,
        field: string,
        value: string,
    ) => {
        const updated = [...phicBracketsData];
        updated[index] = { ...updated[index], [field]: value };
        setPHICBracketsData(updated);
    };

    const handleSaveBrackets = (type: string) => {
        let url = '';
        let data = {};

        if (type === 'sss_contribution') {
            url = '/sss-brackets';
            data = { brackets: sssBracketsData };
        } else if (type === 'income_tax') {
            url = '/tax-brackets';
            data = { brackets: taxBracketsData };
        } else if (type === 'phic') {
            url = '/phic-brackets';
            data = { brackets: phicBracketsData };
        }

        router.put(url, data, {
            preserveScroll: true,
            onSuccess: () => {
                const label =
                    type === 'sss_contribution'
                        ? 'SSS'
                        : type === 'phic'
                          ? 'PHIC'
                          : 'Tax';
                toast.success(`${label} brackets updated successfully!`);
                setShowModal(false);
                setIsEditMode(false);
            },
            onError: (errors) => {
                console.error('Error:', errors);
                const label =
                    type === 'sss_contribution'
                        ? 'SSS'
                        : type === 'phic'
                          ? 'PHIC'
                          : 'Tax';
                toast.error(`Failed to update ${label} brackets.`);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deduction Settings" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Deduction Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Configure deduction types and their settings
                    </p>
                </div>

                {/* Settings Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Deduction Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Deduction Name</TableHead>
                                    <TableHead>Last Update</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allDeductionTypes.map(({ key, label }) => {
                                    const setting = settings[key];

                                    return (
                                        <TableRow
                                            key={key}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => openModal(key)}
                                        >
                                            <TableCell className="font-medium">
                                                {label}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    setting?.updated_at,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent
                    className={
                        selectedType === 'sss_contribution' ||
                        selectedType === 'income_tax' ||
                        selectedType === 'phic'
                            ? 'w-full max-w-[90vw] sm:max-w-5xl'
                            : 'max-w-md'
                    }
                >
                    <DialogHeader>
                        <DialogTitle>
                            Setup:{' '}
                            {selectedType &&
                                allDeductionTypes.find(
                                    (t) => t.key === selectedType,
                                )?.label}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedType === 'sss_contribution' ? (
                        <div className="py-4">
                            <div className="mb-4 max-h-96 overflow-y-auto rounded border">
                                <Table className="text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="px-2">
                                                From (₱)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                To (₱)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                ER (₱)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                EE (₱)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                Total (₱)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                Others
                                            </TableHead>
                                            {isEditMode && (
                                                <TableHead className="px-2">
                                                    Action
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sssBracketsData.map(
                                            (bracket, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.from
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSSSBracket(
                                                                        index,
                                                                        'from',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.from)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.to
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSSSBracket(
                                                                        index,
                                                                        'to',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.to)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.er
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSSSBracket(
                                                                        index,
                                                                        'er',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.er)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.ee
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSSSBracket(
                                                                        index,
                                                                        'ee',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.ee)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.total
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSSSBracket(
                                                                        index,
                                                                        'total',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.total)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                value={
                                                                    bracket.others ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateSSSBracket(
                                                                        index,
                                                                        'others',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            bracket.others ||
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    {isEditMode && (
                                                        <TableCell className="px-2">
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemoveSSSBracket(
                                                                        index,
                                                                    )
                                                                }
                                                                className="h-8 px-2 text-xs"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {isEditMode && (
                                <Button
                                    onClick={handleAddSSSBracket}
                                    className="mb-4 w-full"
                                >
                                    Add Bracket
                                </Button>
                            )}
                        </div>
                    ) : selectedType === 'income_tax' ? (
                        <div className="py-4">
                            <div className="mb-4 max-h-96 overflow-y-auto rounded border">
                                <Table className="text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="px-2">
                                                From (₱)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                To (₱)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                Percentage (%)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                Fixed Amount (₱)
                                            </TableHead>
                                            {isEditMode && (
                                                <TableHead className="px-2">
                                                    Action
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {taxBracketsData.map(
                                            (bracket, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.from
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateTaxBracket(
                                                                        index,
                                                                        'from',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.from)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.to ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateTaxBracket(
                                                                        index,
                                                                        'to',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.to) || '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.percentage
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateTaxBracket(
                                                                        index,
                                                                        'percentage',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            bracket.percentage
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.fixed_amount ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdateTaxBracket(
                                                                        index,
                                                                        'fixed_amount',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.fixed_amount) ||
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    {isEditMode && (
                                                        <TableCell className="px-2">
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemoveTaxBracket(
                                                                        index,
                                                                    )
                                                                }
                                                                className="h-8 px-2 text-xs"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {isEditMode && (
                                <Button
                                    onClick={handleAddTaxBracket}
                                    className="mb-4 w-full"
                                >
                                    Add Bracket
                                </Button>
                            )}
                        </div>
                    ) : selectedType === 'phic' ? (
                        <div className="py-4">
                            <div className="mb-4 max-h-96 overflow-y-auto rounded border">
                                <Table className="text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="px-2">
                                                From (₱)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                To (₱)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                Percentage (%)
                                            </TableHead>
                                            <TableHead className="px-2">
                                                Fixed Amount (₱)
                                            </TableHead>
                                            {isEditMode && (
                                                <TableHead className="px-2">
                                                    Action
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {phicBracketsData.map(
                                            (bracket, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.from
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdatePHICBracket(
                                                                        index,
                                                                        'from',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.from)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.to ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdatePHICBracket(
                                                                        index,
                                                                        'to',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.to) || '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.percentage
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdatePHICBracket(
                                                                        index,
                                                                        'percentage',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            bracket.percentage
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-2">
                                                        {isEditMode ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    bracket.fixed_amount ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleUpdatePHICBracket(
                                                                        index,
                                                                        'fixed_amount',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 text-xs"
                                                            />
                                                        ) : (
                                                            formatNumberWithCommas(bracket.fixed_amount) ||
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    {isEditMode && (
                                                        <TableCell className="px-2">
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemovePHICBracket(
                                                                        index,
                                                                    )
                                                                }
                                                                className="h-8 px-2 text-xs"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {isEditMode && (
                                <Button
                                    onClick={handleAddPHICBracket}
                                    className="mb-4 w-full"
                                >
                                    Add Bracket
                                </Button>
                            )}
                        </div>
                    ) : selectedType && !isEditableType(selectedType) ? (
                        <div className="py-4">
                            <p className="text-sm text-muted-foreground">
                                {getModalContent(selectedType)}
                            </p>
                        </div>
                    ) : !isEditMode &&
                      ['late_absences', 'hdmf'].includes(selectedType || '') ? (
                        <div className="space-y-4 py-4">
                            {selectedType === 'late_absences' && (
                                <div className="space-y-2">
                                    <Label>Number of Days</Label>
                                    <p className="text-sm">
                                        {settingsForm.data.days || 'Not set'}
                                    </p>
                                </div>
                            )}
                            {selectedType === 'hdmf' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Employee Contribution</Label>
                                        <p className="text-sm">
                                            ₱
                                            {formatNumberWithCommas(settingsForm.data.employee) ||
                                                'Not set'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Employer Contribution</Label>
                                        <p className="text-sm">
                                            ₱
                                            {formatNumberWithCommas(settingsForm.data.employer) ||
                                                'Not set'}
                                        </p>
                                    </div>
                                </>
                            )}
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                >
                                    Close
                                </Button>
                                {canEdit('settings') && (
                                    <Button
                                        type="button"
                                        onClick={() => setIsEditMode(true)}
                                    >
                                        Edit
                                    </Button>
                                )}
                            </DialogFooter>
                        </div>
                    ) : selectedType === 'phic' &&
                      !isEditMode &&
                      canEdit('settings') ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Premium Rate (%)</Label>
                                <p className="text-sm">
                                    {settingsForm.data.rate || 'Not set'}
                                </p>
                            </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Minimum Salary</Label>
                                                                        <p className="text-sm">
                                                                            {formatNumberWithCommas(settingsForm.data.min_salary) || 'Not set'}
                                                                        </p>
                                                                    </div>
                            
                                                                    <div className="space-y-2">
                                                                        <Label>Maximum Salary</Label>
                                                                        <p className="text-sm">
                                                                            {formatNumberWithCommas(settingsForm.data.max_salary) || 'Not set'}
                                                                        </p>
                                                                    </div>
                            <div className="space-y-2">
                                <Label>Employer Share (%)</Label>
                                <p className="text-sm">
                                    {settingsForm.data.employer_share ||
                                        'Not set'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Employee Share (%)</Label>
                                <p className="text-sm">
                                    {settingsForm.data.employee_share ||
                                        'Not set'}
                                </p>
                            </div>
                        </div>
                    ) : canEdit('settings') ? (
                        <form onSubmit={handleSave}>
                            <div className="space-y-4 py-4">
                                {selectedType === 'late_absences' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="days">
                                            Number of Days
                                        </Label>
                                        <Input
                                            id="days"
                                            type="number"
                                            step="0.01"
                                            value={settingsForm.data.days}
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    'days',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g., 22"
                                            required
                                        />
                                        {settingsForm.errors.days && (
                                            <p className="text-sm text-red-500">
                                                {settingsForm.errors.days}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {selectedType === 'phic' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="rate">
                                                Premium Rate (%)
                                            </Label>
                                            <Input
                                                id="rate"
                                                type="number"
                                                step="0.01"
                                                value={settingsForm.data.rate}
                                                onChange={(e) =>
                                                    settingsForm.setData(
                                                        'rate',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g., 5"
                                                required
                                            />
                                            {settingsForm.errors.rate && (
                                                <p className="text-sm text-red-500">
                                                    {settingsForm.errors.rate}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="min_salary">
                                                Minimum Salary
                                            </Label>
                                            <Input
                                                id="min_salary"
                                                type="number"
                                                step="0.01"
                                                value={
                                                    settingsForm.data.min_salary
                                                }
                                                onChange={(e) =>
                                                    settingsForm.setData(
                                                        'min_salary',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g., 10000"
                                                required
                                            />
                                            {settingsForm.errors.min_salary && (
                                                <p className="text-sm text-red-500">
                                                    {
                                                        settingsForm.errors
                                                            .min_salary
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="max_salary">
                                                Maximum Salary
                                            </Label>
                                            <Input
                                                id="max_salary"
                                                type="number"
                                                step="0.01"
                                                value={
                                                    settingsForm.data.max_salary
                                                }
                                                onChange={(e) =>
                                                    settingsForm.setData(
                                                        'max_salary',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g., 100000"
                                                required
                                            />
                                            {settingsForm.errors.max_salary && (
                                                <p className="text-sm text-red-500">
                                                    {
                                                        settingsForm.errors
                                                            .max_salary
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="employer_share">
                                                    Employer Share (%)
                                                </Label>
                                                <Input
                                                    id="employer_share"
                                                    type="number"
                                                    step="0.01"
                                                    value={
                                                        settingsForm.data
                                                            .employer_share
                                                    }
                                                    onChange={(e) =>
                                                        settingsForm.setData(
                                                            'employer_share',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g., 50"
                                                    required
                                                />
                                                {settingsForm.errors
                                                    .employer_share && (
                                                    <p className="text-sm text-red-500">
                                                        {
                                                            settingsForm.errors
                                                                .employer_share
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="employee_share">
                                                    Employee Share (%)
                                                </Label>
                                                <Input
                                                    id="employee_share"
                                                    type="number"
                                                    step="0.01"
                                                    value={
                                                        settingsForm.data
                                                            .employee_share
                                                    }
                                                    onChange={(e) =>
                                                        settingsForm.setData(
                                                            'employee_share',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g., 50"
                                                    required
                                                />
                                                {settingsForm.errors
                                                    .employee_share && (
                                                    <p className="text-sm text-red-500">
                                                        {
                                                            settingsForm.errors
                                                                .employee_share
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedType === 'hdmf' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="employee">
                                                Employee Contribution
                                            </Label>
                                            <Input
                                                id="employee"
                                                type="number"
                                                step="0.01"
                                                value={
                                                    settingsForm.data.employee
                                                }
                                                onChange={(e) =>
                                                    settingsForm.setData(
                                                        'employee',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g., 200"
                                                required
                                            />
                                            {settingsForm.errors.employee && (
                                                <p className="text-sm text-red-500">
                                                    {
                                                        settingsForm.errors
                                                            .employee
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="employer">
                                                Employer Contribution
                                            </Label>
                                            <Input
                                                id="employer"
                                                type="number"
                                                step="0.01"
                                                value={
                                                    settingsForm.data.employer
                                                }
                                                onChange={(e) =>
                                                    settingsForm.setData(
                                                        'employer',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g., 200"
                                                required
                                            />
                                            {settingsForm.errors.employer && (
                                                <p className="text-sm text-red-500">
                                                    {
                                                        settingsForm.errors
                                                            .employer
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setShowModal(false);
                                    }}
                                    disabled={settingsForm.processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={settingsForm.processing}
                                >
                                    {settingsForm.processing
                                        ? 'Saving...'
                                        : 'Save'}
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <div className="space-y-4 py-4">
                            {selectedType === 'late_absences' && (
                                <div className="space-y-2">
                                    <Label>Number of Days</Label>
                                    <p className="text-sm">
                                        {settingsForm.data.days || 'Not set'}
                                    </p>
                                </div>
                            )}
                            {selectedType === 'phic' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Premium Rate (%)</Label>
                                        <p className="text-sm">
                                            {settingsForm.data.rate ||
                                                'Not set'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Employer Share (%)</Label>
                                        <p className="text-sm">
                                            {settingsForm.data.employer_share ||
                                                'Not set'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Employee Share (%)</Label>
                                        <p className="text-sm">
                                            {settingsForm.data.employee_share ||
                                                'Not set'}
                                        </p>
                                    </div>
                                </>
                            )}
                            {selectedType === 'hdmf' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Employee Contribution</Label>
                                        <p className="text-sm">
                                            ₱
                                            {settingsForm.data.employee ||
                                                'Not set'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Employer Contribution</Label>
                                        <p className="text-sm">
                                            ₱
                                            {settingsForm.data.employer ||
                                                'Not set'}
                                        </p>
                                    </div>
                                </>
                            )}
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {(selectedType === 'sss_contribution' ||
                        selectedType === 'income_tax' ||
                        selectedType === 'phic') && (
                        <DialogFooter>
                            {!isEditMode ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Close
                                    </Button>
                                    {canEdit('settings') && (
                                        <Button
                                            type="button"
                                            onClick={() => setIsEditMode(true)}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditMode(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() =>
                                            handleSaveBrackets(selectedType)
                                        }
                                    >
                                        Save
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    )}

                    {selectedType &&
                        !isEditableType(selectedType) &&
                        selectedType !== 'sss_contribution' &&
                        selectedType !== 'income_tax' && (
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
