'use strict';
// Best-effort detection of a host firewall that will silently block the LAN bridge.
//
// Why this exists: on the build machine, `ufw` was enabled with the usual deny-incoming
// default, so a phone on the same wifi could not reach port 7777 — while everything the
// operator could see said the server was fine. It *was* fine. The packets never arrived.
//
// Note the trap this module exists to avoid: you cannot test this by connecting to your own
// LAN address. Linux routes traffic to a locally-bound IP over `lo`, which firewalls allow,
// so a self-test passes while every other device on the network is refused. Detection has to
// read configuration, not probe.
//
// Zero dependencies. Never throws: a firewall we cannot identify must not stop the show.
const fs = require('node:fs');
const os = require('node:os');

/** The /24-style network an address sits on, for a rule that is not "open to the world". */
function subnetOf(address, netmask) {
  if (!address || !netmask) return null;
  const a = address.split('.').map(Number);
  const m = netmask.split('.').map(Number);
  if (a.length !== 4 || m.length !== 4 || [...a, ...m].some((n) => !Number.isInteger(n))) return null;
  const bits = m.reduce((acc, o) => acc + ((o >>> 0).toString(2).match(/1/g) || []).length, 0);
  return `${a.map((o, i) => o & m[i]).join('.')}/${bits}`;
}

/** First non-internal IPv4 interface, with its subnet — what a second device would connect to. */
function primaryLan() {
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.internal) continue;
      if (a.family !== 'IPv4' && a.family !== 4) continue;
      return { address: a.address, subnet: subnetOf(a.address, a.netmask) };
    }
  }
  return null;
}

function ufwEnabled() {
  // /etc/ufw/ufw.conf is world-readable; the rules file (user.rules) is not, so we can tell
  // that ufw is on but not whether this port is already allowed. Saying so is still useful.
  try {
    return /^\s*ENABLED\s*=\s*yes\s*$/im.test(fs.readFileSync('/etc/ufw/ufw.conf', 'utf8'));
  } catch { return false; }
}

function firewalldActive() {
  try {
    // A running firewalld keeps this directory; the unit being enabled is a good enough signal
    // for a hint the operator can act on.
    return fs.existsSync('/etc/firewalld') &&
      (fs.existsSync('/run/firewalld') || fs.existsSync('/var/run/firewalld'));
  } catch { return false; }
}

/**
 * @param {number} port
 * @returns {{ name: string|null, certain: boolean, hint: string|null, subnet: string|null }}
 *   name    - the firewall we believe is in the way, or null if we found none
 *   certain - true when we read it from configuration, false when it is a platform default
 *   hint    - the exact command to open the port, ready to paste
 */
function detectHostFirewall(port) {
  const lan = primaryLan();
  const subnet = lan ? lan.subnet : null;
  const scope = subnet ? `from ${subnet} ` : '';

  if (process.platform === 'linux') {
    if (ufwEnabled()) {
      return {
        name: 'ufw', certain: true, subnet,
        hint: `sudo ufw allow ${scope}to any port ${port} proto tcp`,
      };
    }
    if (firewalldActive()) {
      return {
        name: 'firewalld', certain: true, subnet,
        hint: `sudo firewall-cmd --add-port=${port}/tcp` + (subnet ? `  (or --add-rich-rule='rule family=ipv4 source address=${subnet} port port=${port} protocol=tcp accept')` : ''),
      };
    }
    return { name: null, certain: true, hint: null, subnet };
  }

  if (process.platform === 'win32') {
    // Windows Defender Firewall blocks inbound by default and, for an unsigned portable exe,
    // usually shows no prompt at all — it just drops the connections.
    return {
      name: 'Windows Defender Firewall', certain: false, subnet,
      hint: `In an Administrator PowerShell:  New-NetFirewallRule -DisplayName "System prezentacji scenicznych" -Direction Inbound -Protocol TCP -LocalPort ${port} -Action Allow -Profile Private`,
    };
  }

  if (process.platform === 'darwin') {
    return {
      name: 'macOS application firewall', certain: false, subnet,
      hint: 'System Settings > Network > Firewall > Options: allow incoming connections for this app (macOS may also prompt on first launch — answer Allow).',
    };
  }

  return { name: null, certain: false, hint: null, subnet };
}

module.exports = { detectHostFirewall, primaryLan, subnetOf };
