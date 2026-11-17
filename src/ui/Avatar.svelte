<script lang="ts">
  import { AVATAR_COLORS, initials } from '../shared/members';

  type Props = { name: string; colorIndex: number; size?: 'medium' | 'small' | 'tiny' };
  let { name, colorIndex, size = 'medium' }: Props = $props();
</script>

<span class="avatar {size}" style:background={AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]} aria-hidden="true">
  {initials(name)}
</span>

<style>
  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: inline-grid;
    place-items: center;
    color: #fff;
    font: 600 13px var(--body);
    flex: none;
    letter-spacing: 0.02em;
  }
  .small {
    width: 26px;
    height: 26px;
    font-size: 10.5px;
  }
  .tiny {
    width: 20px;
    height: 20px;
    font-size: 8.5px;
    box-shadow: 0 0 0 1.5px var(--surface);
  }
</style>
