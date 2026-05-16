-- FIX USER MANAGEMENT RLS POLICIES
-- This migration implements non-recursive RLS for the profiles table

-- 1. Helper functions to check roles (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'super_admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;

-- 3. Create new robust policies
-- SELECT: Users can see themselves, Admins can see everyone
CREATE POLICY "Profiles are viewable by owner or admin"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR is_admin()
);

-- UPDATE: Users can update their own data (except role), Super Admins can update anything
CREATE POLICY "Profiles are updatable by owner or super admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR is_super_admin()
)
WITH CHECK (
  (auth.uid() = id AND (CASE WHEN is_super_admin() THEN true ELSE role = (SELECT role FROM public.profiles WHERE id = auth.uid()) END))
  OR is_super_admin()
);

-- DELETE: Only Super Admins can delete personnel (except themselves)
CREATE POLICY "Profiles are deletable by super admin"
ON public.profiles FOR DELETE
TO authenticated
USING (
  is_super_admin() AND auth.uid() <> id
);
