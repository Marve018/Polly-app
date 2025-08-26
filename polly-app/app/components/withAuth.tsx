
'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const Wrapper = (props: P) => {
    const { user, supabase } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!user) {
        router.replace('/auth/login')
      }
    }, [user, router])

    if (!user) {
      return null // or a loading spinner
    }

    return <WrappedComponent {...props} />
  }

  return Wrapper
}

export default withAuth
