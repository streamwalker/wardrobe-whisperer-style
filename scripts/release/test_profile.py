import datetime
import unittest
from validate_profile import validate


class ProfileChecks(unittest.TestCase):
    config = {'team_id': '32N9W9HZ54', 'bundle_id': 'com.streamwalkers.dripslayer'}

    def profile(self):
        return {'TeamIdentifier': ['32N9W9HZ54'],
                'UUID': '11111111-2222-4333-8444-555555555555',
                'ExpirationDate': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=10),
                'Entitlements': {'application-identifier': '32N9W9HZ54.com.streamwalkers.dripslayer', 'get-task-allow': False}}

    def test_valid_exact_distribution_profile(self):
        profile = self.profile()
        self.assertEqual(validate(profile, self.config), profile['UUID'])

    def test_wrong_team_and_wildcard_are_rejected(self):
        profile = self.profile()
        profile['TeamIdentifier'] = ['WRONGTEAM1']
        with self.assertRaisesRegex(ValueError, 'different Apple team'):
            validate(profile, self.config)
        profile = self.profile()
        profile['Entitlements']['application-identifier'] = '32N9W9HZ54.*'
        with self.assertRaisesRegex(ValueError, 'exact app identifier'):
            validate(profile, self.config)

    def test_expired_and_development_profiles_are_rejected(self):
        profile = self.profile()
        profile['ExpirationDate'] = datetime.datetime(2020, 1, 1)
        with self.assertRaisesRegex(ValueError, 'expiration'):
            validate(profile, self.config)
        profile = self.profile()
        profile['ProvisionedDevices'] = ['device']
        with self.assertRaisesRegex(ValueError, 'App Store distribution'):
            validate(profile, self.config)


if __name__ == '__main__':
    unittest.main()
