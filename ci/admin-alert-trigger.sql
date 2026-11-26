create extension if not exists pg_net with schema extensions;
create or replace function public.tg_admin_alert() returns trigger language plpgsql security definer set search_path=public,extensions as $$
declare t text; b text; ty text;
begin
 if TG_OP='INSERT' then
  ty:='admin_new_order'; t:='طلب جديد '||new.order_no; b:=coalesce(new.service_name_ar,'')||' - '||coalesce(new.package_name_ar,'')||' - '||new.total::text||' جنيه مصري';
 elsif new.receipt_path is not null and old.receipt_path is null then
  ty:='admin_receipt'; t:='تم رفع إيصال الدفع'; b:='الطلب '||new.order_no||' - '||new.total::text||' جنيه مصري';
 else return new; end if;
 insert into public.notifications(user_id,kind,type,title,body,order_id) select id,'order',ty,t,b,new.id from public.profiles where role='admin';
 perform net.http_post(url:='https://vwuicbxjnayszplhhoyg.supabase.co/functions/v1/admin-alert-flush', headers:=jsonb_build_object('Content-Type','application/json','apikey','<ANON_KEY>','Authorization','Bearer <ANON_KEY>'), body:='{}'::jsonb);
 return new;
exception when others then return new;
end $$;
revoke all on function public.tg_admin_alert() from public, anon, authenticated;
drop trigger if exists admin_alert_ins on public.orders;
create trigger admin_alert_ins after insert on public.orders for each row execute function public.tg_admin_alert();
drop trigger if exists admin_alert_upd on public.orders;
create trigger admin_alert_upd after update of receipt_path on public.orders for each row execute function public.tg_admin_alert();
