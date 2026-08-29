import { CreatorNav } from '../../nav';
import { CreateForm } from './create-form';
import { ensureDemoLink, getStore } from '../../../src/server/store';

export default async function CreatePage() {
  const link = await ensureDemoLink();
  const origin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  const share = `${origin.replace('http://localhost:3000', 'https://paid.example')}/t/${link.shareId}`;
  void getStore;
  return (
    <main className="page">
      <div className="topbar">
        <div className="brand">Paid</div>
      </div>
      <h1>Create link</h1>
      <CreateForm demoShare={share} />
      <CreatorNav current="/creator/create" />
    </main>
  );
}
