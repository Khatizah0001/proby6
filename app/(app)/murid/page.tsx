import Link from 'next/link'
import { Upload, UserPlus } from 'lucide-react'
import { StudentList } from '@/components/StudentList'
import { Button } from '@/components/ui/button'
import { CAN_EDIT, fetchProfiles, getCurrentUser } from '@/lib/data'

export default async function MuridPage() {
  const user = await getCurrentUser(), list = await fetchProfiles(), edit = CAN_EDIT.includes(user.role)
  return (
    <div className="space-y-4">
      {edit && <div className="flex flex-wrap gap-2.5"><Button asChild><Link href="/murid/baharu"><UserPlus className="mr-2 h-4 w-4" />Tambah Murid</Link></Button><Button asChild variant="outline"><Link href="/import"><Upload className="mr-2 h-4 w-4" />Import Excel / CSV</Link></Button></div>}
      <StudentList items={list} canEdit={edit} />
    </div>
  )
}
