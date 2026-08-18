-- The application has three distinct identities. Customer accounts submit quotes;
-- admin and BD accounts operate the staff dashboards.
alter type app_role add value if not exists 'customer';

alter table profiles
  alter column role set default 'customer';

-- Salesperson ownership is the access boundary for the BD workspace. These
-- indexes keep the assigned-order dashboard fast as the order list grows.
create index if not exists quotes_bd_id_created_at_idx
  on quotes (bd_id, created_at desc);

create index if not exists quotes_assigned_to_created_at_idx
  on quotes (assigned_to, created_at desc);
