import { StudentList } from '@/components/StudentList'
import { CAN_EDIT, fetchProfiles, getCurrentUser } from '@/lib/data'

export default async function MuridPage() {
  const user = await getCurrentUser(), list = await fetchProfiles()
  return <StudentList items={list} canEdit={CAN_EDIT.includes(user.role)} />
}
