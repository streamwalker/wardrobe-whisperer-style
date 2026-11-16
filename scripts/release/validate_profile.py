"""Validate a supplied distribution profile and write nonsecret export options."""
import datetime
import json
import plistlib
import re
import sys
from pathlib import Path


def validate(profile, config, now=None):
    now = now or datetime.datetime.now(datetime.timezone.utc)
    entitlements = profile.get('Entitlements', {})
    team = config['team_id']
    if team not in profile.get('TeamIdentifier', []):
        raise ValueError('Provisioning profile belongs to a different Apple team')
    if entitlements.get('application-identifier') != f"{team}.{config['bundle_id']}":
        raise ValueError('Provisioning profile does not match the exact app identifier')
    if entitlements.get('get-task-allow') or profile.get('ProvisionedDevices') or profile.get('ProvisionsAllDevices'):
        raise ValueError('An App Store distribution profile is required')
    expiry = profile.get('ExpirationDate')
    if not isinstance(expiry, datetime.datetime) or expiry.replace(tzinfo=datetime.timezone.utc) <= now:
        raise ValueError('Provisioning profile is missing a valid future expiration')
    profile_id = profile.get('UUID', '')
    if not re.fullmatch(r'[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}', profile_id):
        raise ValueError('Provisioning profile UUID is invalid')
    return profile_id


if __name__ == '__main__':
    try:
        config = json.loads(Path(sys.argv[1]).read_text())
        profile = plistlib.loads(Path(sys.argv[2]).read_bytes())
        profile_id = validate(profile, config)
        options = {'method': 'app-store-connect', 'destination': 'export',
                   'teamID': config['team_id'], 'signingStyle': 'manual',
                   'signingCertificate': 'Apple Distribution',
                   'manageAppVersionAndBuildNumber': False,
                   'provisioningProfiles': {config['bundle_id']: profile_id}}
        Path(sys.argv[3]).write_bytes(plistlib.dumps(options))
        print(profile_id)
    except (ValueError, KeyError, IndexError, OSError, plistlib.InvalidFileException) as exc:
        print(f'Profile validation failed: {exc}', file=sys.stderr)
        sys.exit(1)
