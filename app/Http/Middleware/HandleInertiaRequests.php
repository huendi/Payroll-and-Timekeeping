<?php

namespace App\Http\Middleware;

use App\Models\Payroll;
use App\Models\Payslip;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Get pending payroll counts based on user role
        $pendingApprovalCount = 0;
        $pendingPayslipCount = 0;
        $payslipsNeedingIncentivesCount = 0;
        $rejectedNotArchivedCount = 0;

        if ($request->user()) {
            if ($request->user()->role === 'admin') {
                // Admin: Count payrolls pending approval (exclude archived)
                $pendingApprovalCount = Payroll::where('status', 'pending')
                    ->where('is_archived', false)
                    ->count();
                
                // Admin: Count approved payrolls without payslips generated (exclude archived)
                $pendingPayslipCount = Payroll::where('status', 'approved')
                    ->where('is_archived', false)
                    ->whereDoesntHave('payslips')
                    ->count();
                
                // Admin: Count payslips with null incentives (exclude archived)
                $payslipsNeedingIncentivesCount = Payslip::whereNull('incentives')
                    ->where('is_archived', false)
                    ->count();
            } elseif ($request->user()->role === 'finance') {
                // Finance: Count rejected payrolls that are not archived
                $rejectedNotArchivedCount = Payroll::where('status', 'rejected')
                    ->where('is_archived', false)
                    ->count();
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'avatar' => $request->user()->avatar,
                    'role' => $request->user()->role,
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'pendingApprovalCount' => $pendingApprovalCount,
            'pendingPayslipCount' => $pendingPayslipCount,
            'payslipsNeedingIncentivesCount' => $payslipsNeedingIncentivesCount,
            'rejectedNotArchivedCount' => $rejectedNotArchivedCount,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
        ];
    }
}
