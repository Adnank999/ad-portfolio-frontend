import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { forgotPasswordFn, loginFn, logoutFn, meFn, registerFn, resetPasswordFn } from '@/server/portfolio-auth'

export const authKeys = { me: ['auth', 'me'] as const }

export const meOptions = () => queryOptions({
  queryKey: authKeys.me,
  queryFn: () => meFn(),
  staleTime: 15_000,
  retry: false,
})

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => loginFn({ data: input }),
    onSuccess: (account) => {
      queryClient.clear()
      queryClient.setQueryData(authKeys.me, account)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: () => logoutFn(), onSettled: () => queryClient.clear() })
}

export const useRegister = () => useMutation({ mutationFn: (input: { name: string; email: string; password: string }) => registerFn({ data: input }) })
export const useForgotPassword = () => useMutation({ mutationFn: (input: { email: string }) => forgotPasswordFn({ data: input }) })
export const useResetPassword = () => useMutation({ mutationFn: (input: { token: string; password: string }) => resetPasswordFn({ data: input }) })
