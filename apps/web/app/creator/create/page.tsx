import { CreatorNav } from '../../nav';
import { CreateForm } from './create-form';

export default async function CreatePage() {
  return (
    <main className="page">
      <div className="topbar">
        <div className="brand">Paid</div>
      </div>
      <h1>Create link</h1>
      <CreateForm />
      <CreatorNav current="/creator/create" />
    </main>
  );
}
