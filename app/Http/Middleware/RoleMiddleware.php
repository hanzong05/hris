<?php
// app/Http/Middleware/RoleMiddleware.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\DepartmentManager;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = Auth::user();

        if (!$user) {
            return redirect('/login');
        }

        foreach ($roles as $role) {
            if ($this->userHasRole($user, $role)) {
                return $next($request);
            }
        }

        return redirect('/dashboard')
            ->with('error', 'You do not have permission to access this page.');
    }

    /**
     * Check if a user has a specific role.
     *
     * @param  \App\Models\User  $user
     * @param  string  $roleName
     * @return bool
     */
    private function userHasRole($user, $roleName): bool
    {
        // If the user has a roles relationship
        if (method_exists($user, 'roles') && $user->roles) {
            return $user->roles->pluck('name')->contains($roleName);
        }
        
        // If the user has a getRoleSlug method
        if (method_exists($user, 'getRoleSlug')) {
            $roleSlug = $user->getRoleSlug();
            return $roleSlug === $roleName;
        }
        
        // Check user permissions/roles table if it exists
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole($roleName);
        }
        
        // Fallback for simple role detection based on username/email patterns
        switch ($roleName) {
            case 'superadmin':
                return stripos($user->name, 'admin') !== false || $user->id === 1;
            case 'hrd_manager':
                return stripos($user->name, 'hrd manager') !== false || 
                       stripos($user->email, 'hrdmanager') !== false;
            case 'hrd_timekeeper':
                return stripos($user->name, 'timekeeper') !== false || 
                       stripos($user->email, 'timekeeper') !== false;
            case 'department_manager':
                // Check if user is assigned as a manager for any department
                return DepartmentManager::where('manager_id', $user->id)->exists();
            default:
                return false;
        }
    }
}