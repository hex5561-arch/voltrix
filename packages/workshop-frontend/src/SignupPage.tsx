import { RpcStub } from 'capnweb'
import { PublicApi } from '@gadgets/workshop-shared/api'
import LoginPage from './LoginPage'

export interface SignupPageProps {
  rpcStub: RpcStub<PublicApi>
}

export default function SignupPage({ rpcStub }: SignupPageProps) {
  return <LoginPage rpcStub={rpcStub} initialTab="signup" />
}
